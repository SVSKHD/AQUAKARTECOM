import { useState } from 'react';
import AquaResponsiveDialog from '../reusables/dialog';

const AquaAuthDialog=()=> {
  const [open, setOpen] = useState(true);

  const handleConfirm = () => {
    console.log('Confirmed');
    setOpen(false);
  };

  return (
    <div className="p-4">
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Open Dialog
      </button>
      <AquaResponsiveDialog
        open={open}
        setOpen={setOpen}
        title="Auth"
        onConfirm={handleConfirm}
      >
        <p className="text-sm text-gray-500">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.
        </p>
      </AquaResponsiveDialog>
    </div>
  );
}
export default AquaAuthDialog