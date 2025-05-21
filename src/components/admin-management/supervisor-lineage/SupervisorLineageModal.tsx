"use client";
import { Lineage, useLineage } from "@/hooks/useSupervisorLineage";
import { useEffect, useState } from "react";
import { lineageSchema } from "@/lib/types";
import { z } from "zod";
import { Trash } from "@phosphor-icons/react";


interface LineageModalProps {
  initialData?: Lineage[] | null;
  onSubmit: (values: z.infer<typeof lineageSchema>[]) => void;
  onClose: () => void;
}

interface HierarchyLevel {
  level: number;
  position_id: number | null;
}

interface Position {
  id: number;
  name: string;
}

export default function LineageCreateModal({
  onSubmit,
  onClose,
}: LineageModalProps) {
  const { lineages, fetchLineages } = useLineage();
  const [name, setName] = useState<string>("");
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [showAddButton, setShowAddButton] = useState<boolean>(true);
  const [remainingPositions, setRemainingPositions] = useState<Position[]>([]);

  useEffect(() => {
    async function fetchPositions() {
      try {
        const positions = await import("@/lib/api/company").then(
          (module) => module.getPositions()
        );
        setAllPositions(positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    fetchLineages();
  }, [fetchLineages]);

  const getAvailablePositions = (levelIndex: number) => {
    // Get all position IDs that have been selected in previous levels
    const selectedPositionIds = hierarchy
      .slice(0, levelIndex)
      .map((item) => item.position_id)
      .filter(Boolean) as number[];

    return remainingPositions.filter(
      (position) => !selectedPositionIds.includes(position.id)
    );
  };

  const handlePositionChange = (levelIndex: number, position_id: number) => {
    setHierarchy((prev) => {
      // Create new array with all positions
      const newHierarchy = [...prev];

      // Nullify any previous occurrence of this position_id
      newHierarchy.forEach((level, index) => {
        if (level.position_id === position_id && index !== levelIndex) {
          newHierarchy[index] = { ...level, position_id: null };
        }
      });

      // Update the current level
      newHierarchy[levelIndex] = { ...newHierarchy[levelIndex], position_id };

      return newHierarchy;
    });
  };

  const removeLevel = (levelIndex: number) => {
    setHierarchy((prev) => {
      // Create a new array without the level we're removing
      const newHierarchy = prev.filter((_, index) => index !== levelIndex);

      // Reassign level numbers to maintain proper ordering
      return newHierarchy.map((level, index) => ({
        ...level,
        level: index + 1,
      }));
    });
  };

  const addNewLevel = () => {
    setHierarchy((prev) => {
      const selectedPositionIds = prev
        .map((l) => l.position_id)
        .filter(Boolean) as number[];
      const remainingPositions = allPositions.filter(
        (p) => !selectedPositionIds.includes(p.id)
      );

      if (remainingPositions.length > 0) {
        return [
          ...prev,
          { level: prev.length + 1, position_id: remainingPositions[0].id },
        ];
      }
      return prev;
    });
  };
  const handleSave = () => {
    const lineageData = hierarchy
      .filter((level) => level.position_id !== null)
      .map((level) => ({
        position_id: level.position_id as number,
        hierarchical_level: level.level,
        name: name,
        company_id: 0,
      }));

    if (lineageData.length > 0) {
      onSubmit(lineageData);
    }
  };

  useEffect(() => {
    setShowAddButton(hierarchy.length < allPositions.length);
  }, [hierarchy, allPositions]);

  useEffect(() => {
    if (allPositions.length > 0) {
      const usedPositionIds = new Set(
        lineages.map((lineage: Lineage) => lineage.position_id)
      );
      const availablePositions = allPositions.filter(
        (pos) => !usedPositionIds.has(pos.id)
      );
      setRemainingPositions(availablePositions);
    }
  }, [lineages, allPositions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Create Lineage</h2>

        <div className="mb-4">
          <label className="block font-semibold text-blue-800 mb-2">
            Lineage Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Lineage Name"
          />
        </div>

        <div className="bg-white py-6 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-blue-700 mb-6">
            Lineage Details
          </h2>

          <div className="flex flex-col items-center justify-center w-full">
            <h3 className="text-md font-semibold text-blue-900 mb-4 self-start">
              Set Hierarchy
            </h3>

            <div className="flex flex-col w-full max-w-md pr-6">
              {/* Single position case */}
              {/* {allPositions.length === 1 && (
                <div className="rounded-md bg-blue-100 px-4 py-2 border border-transparent">
                  {allPositions[0].name}
                </div>
              )} */}

              {/* Multiple positions case */}
              {allPositions.length > 0 &&
                hierarchy.map((level, index) => {
                  const availablePositions = getAvailablePositions(index);
                  return (
                    <div key={index} className="relative">
                      <select
                        value={level.position_id || ""}
                        onChange={(e) =>
                          handlePositionChange(index, parseInt(e.target.value))
                        }
                        className="w-full rounded-md bg-blue-100 px-4 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option>Select position for Level {level.level}</option>
                        {availablePositions.map((position) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </select>
                      {index > 0 && (
                        <button
                          onClick={() => removeLevel(index)}
                          className="absolute right-[-2rem] top-1/2 -translate-y-1/2 text-red-600"
                          aria-label="Remove level"
                        >
                          <Trash size={18} />
                        </button>
                      )}
                      {index < hierarchy.length - 1 && (
                        <div className="flex justify-center">
                          <div className="h-6 w-1 bg-blue-700 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {showAddButton && (
                <button
                  type="button"
                  onClick={addNewLevel}
                  className="mt-2 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8 gap-4">
            <button
              onClick={onClose}
              className="bg-blue-900 text-white font-semibold px-6 py-2 rounded-full shadow-md transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={
                hierarchy.length === 0 ||
                !name ||
                hierarchy.some(
                  (level) =>
                    level.position_id === null ||
                    Number.isNaN(level.position_id)
                )
              }
              className="bg-[#FFC700] hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function compareLineages(arr1: Lineage[], arr2: HierarchyLevel[]): boolean {
  // Check if arrays have different lengths
  if (arr1.length !== arr2.length) {
    return false;
  }

  // Compare each object's position_id AND hierarchical_level
  for (let i = 0; i < arr1.length; i++) {
    if (
      arr1[i].position_id !== arr2[i].position_id ||
      arr1[i].hierarchical_level !== arr2[i].level
    ) {
      return false;
    }
  }

  return true;
}

export function LineageUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: LineageModalProps) {
  const { lineages, fetchLineages } = useLineage();
  const [name, setName] = useState<string>("");
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
  const [showAddButton, setShowAddButton] = useState<boolean>(true);
  const [remainingPositions, setRemainingPositions] = useState<Position[]>([]);

  useEffect(() => {
    async function fetchPositions() {
      try {
        const positions = await import("@/lib/api/company").then(
          (module) => module.getPositions()
        );
        setAllPositions(positions);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPositions();
  }, []);

  useEffect(() => {
    fetchLineages();
  }, [fetchLineages]);

  const getAvailablePositions = (levelIndex: number) => {
    const selectedPositionIds = hierarchy
      .slice(0, levelIndex)
      .map((item) => item.position_id)
      .filter(Boolean) as number[];

    return allPositions.filter(
      (position) => !selectedPositionIds.includes(position.id)
    );
  };

  const handlePositionChange = (levelIndex: number, position_id: number) => {
    setHierarchy((prev) => {
      // Create new array with all positions
      const newHierarchy = [...prev];

      // Nullify any previous occurrence of this position_id
      newHierarchy.forEach((level, index) => {
        if (level.position_id === position_id && index !== levelIndex) {
          newHierarchy[index] = { ...level, position_id: null };
        }
      });

      // Update the current level
      newHierarchy[levelIndex] = { ...newHierarchy[levelIndex], position_id };

      return newHierarchy;
    });
  };

  const removeLevel = (levelIndex: number) => {
    setHierarchy((prev) => {
      // Create a new array without the level we're removing
      const newHierarchy = prev.filter((_, index) => index !== levelIndex);

      // Reassign level numbers to maintain proper ordering
      return newHierarchy.map((level, index) => ({
        ...level,
        level: index + 1,
      }));
    });
  };

  const addNewLevel = () => {
    setHierarchy((prev) => {
      const selectedPositionIds = prev
        .map((l) => l.position_id)
        .filter(Boolean) as number[];
      const remainingPositions = allPositions.filter(
        (p) => !selectedPositionIds.includes(p.id)
      );

      if (remainingPositions.length > 0) {
        return [
          ...prev,
          { level: prev.length + 1, position_id: remainingPositions[0].id },
        ];
      }
      return prev;
    });
  };
  const handleSave = () => {
    const lineageData = hierarchy
      .filter((level) => level.position_id !== null)
      .map((level) => ({
        position_id: level.position_id as number,
        hierarchical_level: level.level,
        name: name,
        company_id: 0,
      }));

    if (lineageData.length > 0) {
      onSubmit(lineageData);
    }
  };

  useEffect(() => {
    setShowAddButton(hierarchy.length < allPositions.length);
  }, [hierarchy, allPositions]);

  useEffect(() => {
    if (allPositions.length > 0) {
      const usedPositionIds = new Set(
        hierarchy.map((h: HierarchyLevel) => h.position_id)
      );
      const availablePositions = allPositions.filter(
        (pos) => !usedPositionIds.has(pos.id)
      );
      setRemainingPositions(availablePositions);
    }
  }, [hierarchy, allPositions]);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setName(initialData[0].name);
      setHierarchy(
        initialData.map((level) => {
          return {
            level: level.hierarchical_level,
            position_id: level.position_id,
          };
        })
      );
    }
  }, [initialData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Lineage" : "Create Lineage"}
        </h2>

        <div className="mb-4">
          <label className="block font-semibold text-blue-800 mb-2">
            Lineage Name
          </label>
          <input
            type="text"
            value={name}
            readOnly
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Lineage Name"
          />
        </div>

        <div className="bg-white py-6 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-blue-700 mb-6">
            Lineage Details
          </h2>

          <div className="flex flex-col items-center justify-center w-full">
            <h3 className="text-md font-semibold text-blue-900 mb-4 self-start">
              Set Hierarchy
            </h3>

            <div className="flex flex-col w-full max-w-md pr-6">
              {/* Single position case */}
              {/* {allPositions.length === 1 && (
                <div className="rounded-md bg-blue-100 px-4 py-2 border border-transparent">
                  {allPositions[0].name}
                </div>
              )} */}

              {/* Multiple positions case */}
              {allPositions.length > 0 &&
                hierarchy.map((level, index) => {
                  const availablePositions = getAvailablePositions(index);
                  return (
                    <div key={index} className="relative">
                      <select
                        value={level.position_id || ""}
                        onChange={(e) =>
                          handlePositionChange(index, parseInt(e.target.value))
                        }
                        className="w-full rounded-md bg-blue-100 px-4 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option>Select position for Level {level.level}</option>
                        {availablePositions.map((position) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </select>
                      {index > 0 && (
                        <button
                          onClick={() => removeLevel(index)}
                          className="absolute right-[-2rem] top-1/2 -translate-y-1/2 text-red-600"
                          aria-label="Remove level"
                        >
                          <Trash size={18} />
                        </button>
                      )}
                      {index < hierarchy.length - 1 && (
                        <div className="flex justify-center">
                          <div className="h-6 w-1 bg-blue-700 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {showAddButton && (
                <button
                  type="button"
                  onClick={addNewLevel}
                  className="mt-2 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8 gap-4">
            <button
              onClick={onClose}
              className="bg-blue-900 text-white font-semibold px-6 py-2 rounded-full shadow-md transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={
                hierarchy.length === 0 ||
                !name ||
                hierarchy.some(
                  (level) =>
                    level.position_id === null ||
                    Number.isNaN(level.position_id)
                ) ||
                !!(initialData && initialData.length > 0 && name === initialData[0].name && compareLineages(initialData, hierarchy))
              }
              className="bg-[#FFC700] hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
