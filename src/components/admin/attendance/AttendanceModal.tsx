"use client";
import dynamic from "next/dynamic";
const ClientMap = dynamic(() => import("./ClientMap"), { ssr: false });
import { useEffect, useState } from "react";
import { validateSite, validationErrorsToObject } from "@/lib/utils/validation";
import { Site } from "@/lib/types";
import { dirtyValuesChecker } from "@/lib/utils";
import { MapPin, Clock, ClockClockwise, Buildings, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

type Coordinates = {
  lat: number;
  lng: number;
};

type FormValues = Site;

interface AttendanceCreateModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface AttendanceUpdateModalProps {
  initialData: Site;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function AttendanceCreateModal({
  onSubmit,
  onClose,
  isLoading = false
}: AttendanceCreateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = validateSite(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = validateSite(formValues);

    if (!result.success) {
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data!);
    setIsSubmitting(false);
  };

  // Map related state and effects
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, map.getZoom());
    }

    if (coordinates) {
      setFormValues((prev) => ({
        ...prev,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        location: `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}`,
      }));
    }
  }, [coordinates, map]);

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Buildings size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Configure Attendance Site</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <X size={20} weight="bold" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Site Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Buildings size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Site Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Check In Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={18} weight="duotone" className="text-gray-500" />
                </div>
                <input
                  name="check_in"
                  type="time"
                  value={formValues.check_in}
                  onChange={handleChange}
                  className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              {errors.check_in && (
                <p className="text-red-500 text-sm mt-1">{errors.check_in}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Check Out Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockClockwise size={18} weight="duotone" className="text-gray-500" />
                </div>
                <input
                  name="check_out"
                  type="time"
                  value={formValues.check_out}
                  onChange={handleChange}
                  className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              {errors.check_out && (
                <p className="text-red-500 text-sm mt-1">{errors.check_out}</p>
              )}
            </div>
          </div>

          <div className="mt-2">
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={18} weight="duotone" className="text-gray-500" />
              Location
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ClientMap
                type="create"
                value={coordinates!}
                onChange={(coords) =>
                  setFormValues({
                    ...formValues,
                    latitude: coords.lat,
                    longitude: coords.lng,
                  })
                }
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end mt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={!!(isLoading || isSubmitting)}
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Create Site
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}

export function AttendanceUpdateModal({
  initialData,
  onSubmit,
  onClose,
  isLoading = false
}: AttendanceUpdateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = validateSite(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
    }
  }, [formValues]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = validateSite(formValues);

    if (!result.success) {
      const newErrors = validationErrorsToObject(result.errors);
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data!);
    setIsSubmitting(false);
  };

  // Map related state and effects
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (coordinates && map) {
      map.setView(coordinates, map.getZoom());
    }
  }, [coordinates, map]);

  useEffect(() => {
    setFormValues(initialData);
    setCoordinates({
      lat: initialData.latitude,
      lng: initialData.longitude,
    });
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8 backdrop-blur-sm">
      <motion.form
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl border border-gray-200"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Buildings size={24} weight="duotone" className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Configure Attendance Site</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <X size={20} weight="bold" />
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Site Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Buildings size={18} weight="duotone" className="text-gray-500" />
              </div>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                placeholder="Enter Site Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Check In Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={18} weight="duotone" className="text-gray-500" />
                </div>
                <input
                  name="check_in"
                  type="time"
                  value={formValues.check_in}
                  onChange={handleChange}
                  className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              {errors.check_in && (
                <p className="text-red-500 text-sm mt-1">{errors.check_in}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Check Out Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockClockwise size={18} weight="duotone" className="text-gray-500" />
                </div>
                <input
                  name="check_out"
                  type="time"
                  value={formValues.check_out}
                  onChange={handleChange}
                  className="w-full pl-10 rounded-md bg-gray-50 p-2.5 border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                />
              </div>
              {errors.check_out && (
                <p className="text-red-500 text-sm mt-1">{errors.check_out}</p>
              )}
            </div>
          </div>

          <div className="mt-2">
            <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={18} weight="duotone" className="text-gray-500" />
              Location
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ClientMap
                type="update"
                value={coordinates!}
                onChange={(coords) =>
                  setFormValues({
                    ...formValues,
                    latitude: coords.lat,
                    longitude: coords.lng,
                  })
                }
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex justify-end mt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={!!(isLoading || isSubmitting)}
            disabled={
              isLoading ||
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0 ||
              !isDirty
            }
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            Update Site
          </Button>
        </motion.div>
      </motion.form>
    </div>
  );
}
