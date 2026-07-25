export default function Footer() {
  return (
    <footer className="border-t border-slate-600 bg-slate-950 w-full">
      <div className="flex items-center justify-center px-4 py-4 text-sm text-slate-300">
        Built for{" "}
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Digital Heroes Training Task
        </a>
      </div>
    </footer>
  )
}
