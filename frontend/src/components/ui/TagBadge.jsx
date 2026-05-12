export default function TagBadge({ tag }) {
  if (!tag?.name) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: tag.color + "2a",
        color: tag.color,
        border: `1px solid ${tag.color}55`,
      }}
    >
      {tag.name}
    </span>
  );
}
