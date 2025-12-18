import { useState } from 'react';
import ContractorProfileButton from './ContractorProfileButton';
import ContractorProfileSheet from './ContractorProfileSheet';

export default function ContractorProfileHeaderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ContractorProfileButton onPress={() => setOpen(true)} />
      <ContractorProfileSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
