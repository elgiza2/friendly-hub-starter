const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4";

/** Global site background: the login video, used across every page. */
export function SiteBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover anim-hero"
        style={{
          objectPosition: "center 68%",
          filter: "brightness(1.5) saturate(1.4) contrast(1.05)",
        }}
      >
        <source src={BG_VIDEO} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,8,10,0.02) 0%, rgba(7,8,10,0.06) 58%, rgba(7,8,10,0.03) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[34%]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,8,10,0) 0%, rgba(7,8,10,0.06) 100%)",
        }}
      />

    </div>
  );
}
