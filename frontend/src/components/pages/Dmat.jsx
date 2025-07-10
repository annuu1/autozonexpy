import React, { useState } from 'react';
import DmatDetail from './DmatDetail';
import DmatOverview from './DmatOverview';

const Dmat = () => {
  const [dmats, setDmats] = useState([
    { id: 1, name: 'KOTAK NEO', broker: 'KOTAK NEO', balance: 15000, status: 'Active', holdings: [] },
  ]);

  const addDmat = (newDmat) => {
    setDmats([...dmats, { id: dmats.length + 1, ...newDmat, status: 'Active', holdings: [] }]);
  };

  const addTrade = (dmatId, trade) => {
    setDmats(
      dmats.map((dmat) =>
        dmat.id === dmatId ? { ...dmat, holdings: [...dmat.holdings, trade] } : dmat
      )
    );
  };

  return (
    <>
      <DmatOverview dmats={dmats} addDmat={addDmat} />
    </>
  );
};

export default Dmat;
