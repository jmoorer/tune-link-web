import React, { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
export type ItemContext = {
  listeners: SyntheticListenerMap | undefined;
  handleRef: (element: HTMLElement | null) => void;
};
interface Props {
  id: UniqueIdentifier;
  children: (context: ItemContext) => React.ReactNode;
  className?: string;
  disableDrag?: boolean;
}
export function SortableItem(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "auto",
    touchAction: "none",
  };
  return (
    <div
      className={props.className}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {props.children({ listeners, handleRef: setActivatorNodeRef })}
    </div>
  );
}
