import { useEffect, useState } from "react";
import type { StageRunRecord } from "../../shared/types";
import {
  loadRecords,
  saveRecords,
} from "../../storage/repositories/recordsRepo";

export const useRecords = () => {
  const [records, setRecords] = useState<StageRunRecord[]>(() => loadRecords());

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const addRecord = (record: StageRunRecord) => {
    setRecords((prev) => [...prev, record]);
  };

  const clearRecords = () => {
    setRecords([]);
  };

  return {
    records,
    addRecord,
    clearRecords,
  };
};
