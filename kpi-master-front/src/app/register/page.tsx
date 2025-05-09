export default function RegisterPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white shadow rounded-lg">
          <h1 className="text-2xl font-semibold mb-4">Register</h1>
          <form>
            <input type="text" placeholder="Username" className="w-full mb-3 px-3 py-2 border rounded"/>
            <input type="email" placeholder="Email" className="w-full mb-3 px-3 py-2 border rounded"/>
            <input type="password" placeholder="Password" className="w-full mb-3 px-3 py-2 border rounded"/>
            <button className="w-full py-2 bg-blue-500 text-white rounded">Register</button>
          </form>
        </div>
      </div>
    );
  }
  