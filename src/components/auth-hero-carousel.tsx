"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const slides = [
  {
    logo: "/images/BhisaKirim_3.png",
    src: "/images/jasa-pengiriman.jpg",
    title: "Pengiriman Cepat",
    description: "Layanan ekspedisi dengan pengiriman cepat dan aman.",
  },
  {
    logo: "/images/BhisaKirim_3.png",
    src: "/images/laporan-pengiriman.jpg",
    title: "Laporan Detail",
    description: "Semua laporan pengiriman dan keuangan dalam satu tempat.",
  },
];

export function AuthHeroCarousel() {
  return (
    <div className="relative flex-col items-center justify-center hidden bg-blue-100 lg:flex bg-muted">
      <Swiper
        spaceBetween={30}
        slidesPerView={1}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay]}
        className="w-full max-w-lg"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="flex flex-col items-center text-center">
              <Image
                src={slide.logo}
                width={80}
                height={50}
                alt={slide.title}
                className="rounded-lg shadow-lg"
              />
              <Image
                src={slide.src}
                width={400}
                height={200}
                alt={slide.title}
                className="rounded-lg"
              />
              <h2 className="mt-4 mb-2 text-3xl font-bold text-blue-500">
                {slide.title}
              </h2>
              <p className="text-xl text-gray-600">{slide.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
