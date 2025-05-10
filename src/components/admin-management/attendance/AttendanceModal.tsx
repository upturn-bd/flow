"use client";
import dynamic from "next/dynamic";
const ClientMap = dynamic(() => import("./ClientMap"), { ssr: false });
import { useEffect, useRef, useState } from "react";
import { siteSchema } from "@/lib/types";
import { z } from "zod";
import { Site } from "@/hooks/useAttendanceManagement";
import { dirtyValuesChecker } from "@/lib/utils";

type FormValues = z.infer<typeof siteSchema>;

interface AttendanceCreateModalProps {
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

interface AttendanceUpdateModalProps {
  initialData: Site;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}

export default function AttendanceCreateModal({
  onSubmit,
  onClose,
}: AttendanceCreateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    company_id: 0,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = siteSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
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
    const result = siteSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
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

  useEffect(() => {
    console.log("Form Values:", formValues);
  }, [formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Attendance Site</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check In
          </label>
          <input
            name="check_in"
            type="time"
            value={formValues.check_in}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_in && (
            <p className="text-red-500 text-sm">{errors.check_in}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check Out
          </label>
          <input
            name="check_out"
            type="time"
            value={formValues.check_out}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_out && (
            <p className="text-red-500 text-sm">{errors.check_out}</p>
          )}
        </div>

        <ClientMap
          type="create"
          value={coordinates}
          onChange={(coords) =>
            setFormValues({
              ...formValues,
              latitude: coords.lat,
              longitude: coords.lng,
            })
          }
        />

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isSubmitting || !isValid || Object.keys(errors).length > 0
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AttendanceUpdateModal({
  initialData,
  onSubmit,
  onClose,
}: AttendanceUpdateModalProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    id: 0,
    name: "",
    check_in: "",
    check_out: "",
    longitude: 23.8041,
    latitude: 90.4074,
    company_id: 0,
    location: "https://www.openstreetmap.org/?mlat=23.80411&mlon=90.4074",
  });

  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const result = siteSchema.safeParse(formValues);
    if (result.success) {
      setIsValid(true);
      setErrors({});
    } else {
      setIsValid(false);
      const newErrors: Partial<FormValues> = {};
      result.error.errors.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });
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
    const result = siteSchema.safeParse(formValues);

    if (!result.success) {
      const fieldErrors: Partial<FormValues> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] = issue.message;
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    onSubmit(result.data);
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
    console.log("Initial Data:", initialData);
    setFormValues(initialData);
    setCoordinates({
      lat: initialData.latitude,
      lng: initialData.longitude,
    });
  }, [initialData]);

  useEffect(() => {
    setIsDirty(dirtyValuesChecker(initialData, formValues));
  }, [initialData, formValues]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <h2 className="text-xl font-semibold">Configure Attendance Site</h2>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">Name</label>
          <input
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
            placeholder="Enter Name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check In
          </label>
          <input
            name="check_in"
            type="time"
            value={formValues.check_in}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_in && (
            <p className="text-red-500 text-sm">{errors.check_in}</p>
          )}
        </div>
        <div>
          <label className="block font-semibold text-blue-800 mb-1">
            Check Out
          </label>
          <input
            name="check_out"
            type="time"
            value={formValues.check_out}
            onChange={handleChange}
            className="w-full rounded-md bg-blue-50 p-2"
          />
          {errors.check_out && (
            <p className="text-red-500 text-sm">{errors.check_out}</p>
          )}
        </div>

        <ClientMap
          type="update"
          value={coordinates}
          onChange={(coords) =>
            setFormValues({
              ...formValues,
              latitude: coords.lat,
              longitude: coords.lng,
            })
          }
        />

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 bg-[#FFC700] text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#192D46] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isSubmitting ||
              !isValid ||
              Object.keys(errors).length > 0 ||
              !isDirty
            }
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
