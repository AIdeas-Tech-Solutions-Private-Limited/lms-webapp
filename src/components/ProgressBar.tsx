export default function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>
          {completed} / {total} lessons
        </span>
        <span className="font-medium text-violet-600">{percent}%</span>
      </div>
      <div className="w-full bg-violet-100 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
