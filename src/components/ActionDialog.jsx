import React, { useEffect, useRef } from 'react';
import ChoiceCard from './ChoiceCard';

export default function ActionDialog({ character, onSelectOption }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const cancel = () => onSelectOption(character.pendingChoice.choice.options.find(option => option.cancel));
  return <dialog ref={ref} aria-label={character.pendingChoice.choice.title} onCancel={e => { e.preventDefault(); cancel(); }} className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl bg-transparent p-0 backdrop:bg-stone-900/60">
    <ChoiceCard pendingChoice={character.pendingChoice} character={character} onSelectOption={onSelectOption} />
  </dialog>;
}
