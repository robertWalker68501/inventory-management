'use client';

import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function InviteLinkCell({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const invitePath = `/invite/${token}`;

  const copyLink = async () => {
    const inviteUrl = `${window.location.origin}${invitePath}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy link. Select and copy the URL manually.');
    }
  };

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
      <Input
        readOnly
        value={invitePath}
        className='h-8 min-w-0 flex-1 font-mono text-xs'
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className='flex shrink-0 gap-2'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-8'
          onClick={copyLink}
          title='Copy invite link'
        >
          {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='px-2'
          asChild
        >
          <Link
            href={invitePath}
            target='_blank'
            rel='noreferrer'
          >
            Open
          </Link>
        </Button>
      </div>
    </div>
  );
}
