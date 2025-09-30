import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  columnId: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Tarefa 1', columnId: 'col1' },
  { id: '2', title: 'Tarefa 2', columnId: 'col1' },
  { id: '3', title: 'Tarefa 3', columnId: 'col2' },
];

function SortableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 bg-white border rounded shadow cursor-grab active:cursor-grabbing"
    >
      {task.title}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="p-4 bg-white border rounded shadow">
      {task.title}
    </div>
  );
}

function DroppableColumn({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="w-80 p-4 bg-gray-100 rounded">
      <h3 className="font-medium mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function KanbanPOC() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
    console.log('🚀 POC Drag start:', task?.title);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Se estiver sobre uma coluna
    if (over.id === 'col1' || over.id === 'col2') {
      if (activeTask.columnId !== over.id) {
        setTasks(items => 
          items.map(item => 
            item.id === active.id 
              ? { ...item, columnId: over.id as string }
              : item
          )
        );
        console.log('🚀 POC Move to column:', over.id);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const activeTask = tasks.find(t => t.id === active.id);
      const overTask = tasks.find(t => t.id === over.id);
      
      // Reordenar apenas se estão na mesma coluna
      if (activeTask && overTask && activeTask.columnId === overTask.columnId) {
        setTasks((items) => {
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          
          console.log('🚀 POC Reorder:', oldIndex, '->', newIndex);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }

    setActiveTask(null);
  };

  const col1Tasks = tasks.filter(t => t.columnId === 'col1');
  const col2Tasks = tasks.filter(t => t.columnId === 'col2');

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Kanban POC — 2 Colunas</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-6 overflow-x-auto">
          <DroppableColumn id="col1" title="Coluna 1">
            <SortableContext items={col1Tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {col1Tasks.map((task) => (
                <SortableTask key={task.id} task={task} />
              ))}
            </SortableContext>
          </DroppableColumn>

          <DroppableColumn id="col2" title="Coluna 2">
            <SortableContext items={col2Tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {col2Tasks.map((task) => (
                <SortableTask key={task.id} task={task} />
              ))}
            </SortableContext>
          </DroppableColumn>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      
      <div className="mt-4 text-xs text-muted-foreground">POC v2</div>
    </div>
  );
}