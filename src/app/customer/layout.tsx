export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Customer Portal</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}