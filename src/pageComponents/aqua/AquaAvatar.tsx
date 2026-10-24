import logo from "@/assests/logo.png";

// Aquakart logo in a small white disc: who's speaking, next to Aqua's replies and
// notes. (The droplet mascot stays for the big welcome / payment moments.)
export default function AquaAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "#fff",
        border: "1px solid rgba(7,26,37,.08)",
        boxShadow: "0 3px 10px rgba(8,74,84,.12)",
      }}
    >
      <img
        src={logo.src}
        alt=""
        width={Math.round(size * 0.68)}
        height={Math.round(size * 0.68)}
        style={{ display: "block", objectFit: "contain" }}
      />
    </span>
  );
}
