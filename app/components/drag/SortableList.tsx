import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";

import { useState, type ReactNode } from "react";
import { ItemContext, SortableItem } from "./SortableItem";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface BaseItem {
  id: UniqueIdentifier;
}

interface Props<T extends BaseItem> {
  //   children: ReactNode;
  items: T[];
  onDragEnd: (event: DragEndEvent) => void;
  renderItem(item: T, context: ItemContext, index: number): ReactNode;
}
const SortableList = function <T extends BaseItem>({
  items,
  onDragEnd,
  renderItem,
}: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      id={"list"}
      modifiers={[restrictToVerticalAxis]}
      sensors={sensors}
      onDragEnd={(e) => {
        onDragEnd(e);
      }}
      // onDragStart={(e) => setActiveId(e.active.id)}
      onDragCancel={(e) => console.log("cancel", { e })}
      // onDragMove={console.log}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id}>
            {(context) => renderItem(item, context, index)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default SortableList;
