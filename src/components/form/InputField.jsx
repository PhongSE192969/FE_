const InputField = ({ label, required, error, children }) => (
  <div>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

export default InputField;