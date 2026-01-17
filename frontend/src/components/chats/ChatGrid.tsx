import { ChatCard, type Chat } from "./ChatCard"

interface ChatGridProps {
  chats: Chat[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

export function ChatGrid({ chats, selectedIds, onSelectionChange }: ChatGridProps) {
  const handleSelect = (chatId: string, selected: boolean) => {
    const newSelection = new Set(selectedIds)
    if (selected) {
      newSelection.add(chatId)
    } else {
      newSelection.delete(chatId)
    }
    onSelectionChange(newSelection)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chats.map((chat, index) => (
        <ChatCard
          key={chat.id}
          chat={chat}
          selected={selectedIds.has(chat.id)}
          onSelect={(selected) => handleSelect(chat.id, selected)}
          index={index}
        />
      ))}
    </div>
  )
}
