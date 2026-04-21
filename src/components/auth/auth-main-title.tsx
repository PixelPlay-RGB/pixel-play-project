interface Props {
  title: string;
}

export default function AuthMainTitle({ title }: Props) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <h1 className="text-brand text-3xl font-bold tracking-widest uppercase">{title}</h1>
      <div className="h-px w-12 bg-brand/60" />
    </div>
  );
}
