"use client";

import { MapPin, Phone, User, UserCheck } from "lucide-react";
import type { AddressInfo, ReceiverInfo } from "@/types/tracking";
import { Field, TrackCard } from "./tracking-ui";

interface AddressesCardProps {
  sender: AddressInfo;
  receiver: ReceiverInfo;
}

function AddressBody({ info }: { info: AddressInfo }) {
  const postcode = info.postcode || info.zipcode;
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold text-slate-900">
        {info.name || "N/A"}
      </p>
      {info.address && (
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            aria-hidden
          />
          {info.address}
        </p>
      )}
      {info.phone && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          {info.phone}
        </p>
      )}
      {(info.city || info.province || info.district || postcode) && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
          {info.city && <Field label="Kota">{info.city}</Field>}
          {info.province && <Field label="Provinsi">{info.province}</Field>}
          {info.district && <Field label="Kecamatan">{info.district}</Field>}
          {postcode && <Field label="Kode Pos">{postcode}</Field>}
        </dl>
      )}
    </div>
  );
}

export const AddressesCard: React.FC<AddressesCardProps> = ({
  sender,
  receiver,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <TrackCard icon={User} title="Pengirim">
        <AddressBody info={sender} />
      </TrackCard>

      <TrackCard
        icon={UserCheck}
        title="Penerima"
        tone="bg-emerald-50 text-emerald-600"
      >
        <AddressBody info={receiver} />
        {receiver.actual_receiver && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Penerima Aktual</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {receiver.actual_receiver.name}
            </p>
            {receiver.actual_receiver.relationship && (
              <p className="text-xs text-slate-600">
                Hubungan: {receiver.actual_receiver.relationship}
              </p>
            )}
          </div>
        )}
      </TrackCard>
    </div>
  );
};
