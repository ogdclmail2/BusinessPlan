export default function OutputPage() {
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-8 text-center">
      <h2 className="text-lg font-semibold text-ink-800">Output module</h2>
      <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
        Reporting views (annual summaries, version comparisons, exports) get built here once the
        Business Plan module has real data flowing through it.
      </p>
    </div>
  )
}
