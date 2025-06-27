"use client";

import { useState, useCallback } from "react";
import { ModalState, ModalHookResult } from "./types";

const initialModalState: ModalState = {
  isOpen: false,
  mode: 'create',
  selectedItem: null,
};

export function useModalState(): ModalHookResult {
  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const openCreateModal = useCallback(() => {
    setModalState({
      isOpen: true,
      mode: 'create',
      selectedItem: null,
    });
  }, []);

  const openUpdateModal = useCallback((item: any) => {
    setModalState({
      isOpen: true,
      mode: 'update',
      selectedItem: item,
    });
  }, []);

  const openViewModal = useCallback((item: any) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      selectedItem: item,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(initialModalState);
  }, []);

  return {
    modalState,
    openCreateModal,
    openUpdateModal,
    openViewModal,
    closeModal,
  };
}

export default useModalState;
