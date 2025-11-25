export function StatusChips() {
  const statuses = [
    { label: 'Pending', bg: '#FDF3E4', text: '#E8A351' },
    { label: 'Preparing', bg: '#E6F7F6', text: '#5BC7C0' },
    { label: 'Dispatched', bg: '#E6F4F5', text: '#1F6F75' },
    { label: 'Paid', bg: '#E6F7F6', text: '#3A9FA1' },
    { label: 'Cancelled', bg: '#FBECEC', text: '#E96A6A' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h3>Status Chips</h3>
      
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ 
              backgroundColor: status.bg,
              color: status.text
            }}
          >
            {status.label}
          </div>
        ))}
      </div>
    </div>
  );
}
