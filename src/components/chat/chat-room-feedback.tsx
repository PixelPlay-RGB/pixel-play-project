interface Props {
  message: string;
}

export default function ChatRoomFeedback({ message }: Props) {
  return <div className="flex flex-1 items-center justify-center text-zinc-500">{message}</div>;
}
