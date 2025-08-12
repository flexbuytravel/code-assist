
import Image from 'next/image';

export default function SplashPage() {
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
        <Image
          src="/logo2.png"
          alt="FlexBuy Logo"
          width={250}
          height={250}
          data-ai-hint="logo wave"
          className="animate-pulse"
          priority
        />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(() => {
              window.location.href = '/home';
            }, 3000);
          `,
        }}
      />
    </>
  );
}
