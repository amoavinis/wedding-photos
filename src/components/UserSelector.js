export default function UserSelector({updateFn}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: "100%",
        gap: 20,
      }}
    >
      <span>Αναζήτηση με όνομα: </span>
      <input
        style={{
          height: "100%",
          width: "20%",
          borderRadius: 10,
          borderWidth: 1,
        }}
        placeholder="Αναζήτηση"
        onKeyUp={($event) => updateFn($event.target.value)}
      />
    </div>
  );
}
