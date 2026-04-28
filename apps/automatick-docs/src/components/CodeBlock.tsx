import React from 'react';
import { CheckIcon, CopyIcon } from '../layout/icons';

type Props = {
  code: string;
  file?: string;
  lang?: string;
  /** Render the code as-is without copy button or header (for inline code samples). */
  bare?: boolean;
};

export function CodeBlock({ code, file, lang, bare }: Props) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / sandboxed contexts: silently fail.
    }
  };

  if (bare) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div className='codeblock'>
      <div className='cb-header'>
        {file ? <span className='file'>{file}</span> : null}
        {lang ? <span className='lang'>{lang}</span> : null}
        <button type='button' className='copy' onClick={onCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
