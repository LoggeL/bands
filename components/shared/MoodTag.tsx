export default function MoodTag({ mood }: { mood: string | null }) {
  if (!mood) return null;
  return <span className="chip">{mood}</span>;
}
