interface Props {
  text: string;
}

export default function Badge({ text }: Props) {
  return (
    <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-600">
      {text}
    </span>
  );
}