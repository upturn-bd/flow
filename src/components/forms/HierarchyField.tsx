import React from 'react';
import SelectField from './SelectField';
import { Button } from '@/components/ui/button';
import { TrashSimple, Plus } from "@phosphor-icons/react";
import { motion } from 'framer-motion';

interface HierarchyLevel {
  level: number;
  position_id: number | null;
}

interface Position {
  id: number;
  name: string;
}

interface HierarchyFieldProps {
  value: HierarchyLevel[];
  onChange: (value: HierarchyLevel[]) => void;
  positions: Position[];
  label?: string;
  error?: string;
  disabled?: boolean;
}

export default function HierarchyField({
  value: hierarchy,
  onChange: setHierarchy,
  positions,
  label = "Hierarchy",
  error,
  disabled = false
}: HierarchyFieldProps) {
  const getAvailablePositions = (levelIndex: number) => {
    const selectedPositionIds = hierarchy
      .slice(0, levelIndex)
      .map((item) => item.position_id)
      .filter((id): id is number => typeof id === 'number');
    return positions.filter(
      (position) => typeof position.id === 'number' && !selectedPositionIds.includes(position.id)
    );
  };

  const handlePositionChange = (levelIndex: number, position_id: number) => {
    // Create new array with all positions
    const newHierarchy = [...hierarchy];

    // Nullify any previous occurrence of this position_id
    newHierarchy.forEach((level, index) => {
      if (level.position_id === position_id && index !== levelIndex) {
        newHierarchy[index] = { ...level, position_id: null };
      }
    });

    // Update the current level
    newHierarchy[levelIndex] = { ...newHierarchy[levelIndex], position_id };

    setHierarchy(newHierarchy);
  };

  const removeLevel = (levelIndex: number) => {
    // Create a new array without the level we're removing
    const newHierarchy = hierarchy.filter((_: HierarchyLevel, index: number) => index !== levelIndex);

    // Reassign level numbers to maintain proper ordering
    const reorderedHierarchy = newHierarchy.map((level: HierarchyLevel, index: number) => ({
      ...level,
      level: index + 1,
    }));

    setHierarchy(reorderedHierarchy);
  };

  const addNewLevel = () => {
    const selectedPositionIds = hierarchy
      .map((l: HierarchyLevel) => l.position_id)
      .filter((id): id is number => typeof id === 'number');
    const remaining = positions.filter(
      (p) => typeof p.id === 'number' && !selectedPositionIds.includes(p.id)
    );
    if (remaining.length > 0) {
      const newHierarchy = [
        ...hierarchy,
        { level: hierarchy.length + 1, position_id: remaining[0].id ?? null },
      ];
      setHierarchy(newHierarchy);
    }
  };

  const showAddButton = hierarchy.length < positions.length;

  return (
    <div className="space-y-4">
      <label className="block font-semibold text-foreground-primary dark:text-foreground-primary mb-2">
        {label}
      </label>
      
      <div className="bg-surface-primary dark:bg-surface-primary py-4 w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex flex-col w-full max-w-md pr-6">
            {positions.length > 0 &&
              hierarchy.map((level, index) => {
                const availablePositions = getAvailablePositions(index);
                return (
                  <motion.div
                    key={index}
                    className="relative mb-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex gap-2">
                      <SelectField
                        label=""
                        value={level.position_id?.toString() || ""}
                        onChange={(e) => handlePositionChange(index, parseInt(e.target.value))}
                        options={availablePositions.map(pos => ({
                          value: pos.id.toString(),
                          label: pos.name
                        }))}
                        placeholder={`Select position for Level ${level.level}`}
                        disabled={disabled}
                        className="flex-1"
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          onClick={() => removeLevel(index)}
                          variant="outline"
                          size="sm"
                          disabled={disabled}
                          className="bg-error/10 hover:bg-error/20 text-error border border-error/20"
                        >
                          <TrashSimple size={16} weight="duotone" />
                        </Button>
                      )}
                    </div>
                    {index < hierarchy.length - 1 && (
                      <div className="flex justify-center">
                        <div className="h-6 w-0.5 bg-primary-300 dark:bg-primary-700 absolute left-1/2 transform -translate-x-1/2"></div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            {showAddButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewLevel}
                disabled={disabled}
                className="mt-2 flex items-center gap-1 border-primary-200 text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950"
              >
                <Plus size={16} weight="bold" />
                Add Level
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <p className="text-error text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
