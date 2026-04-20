interface Props {
  title: string;
}

export default function AuthMainTitle({ title }: Props) {
  return <h1 className="mb-12 text-center text-4xl font-bold tracking-tight">{title}</h1>;
}
