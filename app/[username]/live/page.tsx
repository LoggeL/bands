import { redirect } from 'next/navigation';

export default async function LiveRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/@${username}/wishlist`);
}
