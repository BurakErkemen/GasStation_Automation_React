export default function ExportButtons({ onExcel, onPdf }) {
  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={onExcel}
        className="flex-1 sm:flex-none text-sm text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        ⬇ Excel
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="flex-1 sm:flex-none text-sm text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        ⬇ PDF
      </button>
    </div>
  );
}
