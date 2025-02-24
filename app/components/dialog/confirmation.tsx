import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Modal } from "./modal";
import { useToggle } from "~/hooks/use-toggle";
interface ConfirmationProps {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export const useConfirmation = ({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmationProps) => {
  const [open, setOpen] = useToggle(false);
  const Dialog = () => {
    return (
      <Confirmation
        open={open}
        setOpen={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmVariant={confirmVariant}
      />
    );
  };
  return [Dialog, [open, setOpen]] as const;
};

export function Confirmation({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  open,
  setOpen,
}: ConfirmationProps) {
  const [openState, setOpenState] = useState(open ?? false);
  const openProp = open ?? openState;
  const setOpenProp = setOpen ?? setOpenState;

  const handleConfirm = () => {
    onConfirm();
    setOpenProp(false);
  };

  const handleCancel = () => {
    setOpenProp(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      title={title}
      description={description}
      open={openProp}
      setOpen={setOpenProp}
      trigger={trigger}
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
