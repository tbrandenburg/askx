"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, VercelIcon } from "./icons";

function PureChatHeader({
  chatId,
}: {
  chatId: string;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-4 py-3 border-b">
      <Button
        className="h-8 px-2"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
        variant="outline"
      >
        <PlusIcon />
        <span className="ml-2">New Chat</span>
      </Button>

      <Button
        asChild
        className="ml-auto bg-zinc-900 px-2 text-zinc-50 hover:bg-zinc-800 h-8 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Link
          href={"https://vercel.com/templates/next.js/chatbot"}
          rel="noreferrer"
          target="_blank"
        >
          <VercelIcon size={16} />
          <span className="ml-2 hidden sm:inline">Deploy with Vercel</span>
        </Link>
      </Button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.chatId === nextProps.chatId;
});
