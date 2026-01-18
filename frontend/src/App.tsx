import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthPage } from "@/pages/AuthPage"
import { VerifyPage } from "@/pages/VerifyPage"
import { ChatsPage } from "@/pages/ChatsPage"
import { WrappedPage } from "@/pages/WrappedPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/wrapped" element={<WrappedPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
