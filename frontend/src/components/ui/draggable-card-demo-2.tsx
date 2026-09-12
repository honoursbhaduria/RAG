import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

export default function DraggableCardDemo() {
  const items = [
    {
      title: "Tyler Durden",
      image:
        "https://images.unsplash.com/photo-1732310216648-603c0255c000?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-8 left-[8%] sm:left-[14%] rotate-[-5deg]",
    },
    {
      title: "The Narrator",
      image:
        "https://images.unsplash.com/photo-1697909623564-3dae17f6c20b?q=80&w=2667&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-36 left-[16%] sm:left-[22%] rotate-[-7deg]",
    },
    {
      title: "Iceland",
      image:
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2600&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-6 left-[30%] sm:left-[36%] rotate-[8deg]",
    },
    {
      title: "Japan",
      image:
        "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=3648&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-32 left-[44%] sm:left-[50%] rotate-[10deg]",
    },
    {
      title: "Norway",
      image:
        "https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?q=80&w=3542&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-16 right-[8%] sm:right-[16%] rotate-[2deg]",
    },
    {
      title: "New Zealand",
      image:
        "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=3070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-24 left-[34%] sm:left-[42%] rotate-[-7deg]",
    },
    {
      title: "Canada",
      image:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      className: "absolute top-10 left-[20%] sm:left-[28%] rotate-[4deg]",
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8">
      <DraggableCardContainer className="relative flex h-[760px] md:h-[840px] w-full items-center justify-center overflow-hidden rounded-[32px] border-2 border-dashed border-neutral-400/80 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/40 shadow-inner select-none">
        {/* Border Status Header */}
        <div className="absolute top-5 left-6 z-20 flex items-center gap-2 select-none pointer-events-none">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-600 dark:bg-neutral-300"></span>
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
            Draggable Area • Move cards within border
          </span>
        </div>

        <p className="absolute top-1/2 mx-auto max-w-lg -translate-y-1/2 text-center text-2xl sm:text-3xl md:text-5xl font-normal libre-caslon-display-regular italic text-neutral-400/80 dark:text-neutral-700 select-none pointer-events-none px-4">
          If its your first day at Fight Club, you have to fight.
        </p>

        {items.map((item) => (
          <DraggableCardBody key={item.title} className={item.className}>
            <img
              src={item.image}
              alt={item.title}
              className="pointer-events-none relative z-10 h-64 sm:h-72 w-full rounded-xl object-cover border border-neutral-200/80 dark:border-neutral-800 shadow-sm"
            />
            <h3 className="mt-4 text-center text-xl font-bold text-neutral-800 dark:text-neutral-200 select-none">
              {item.title}
            </h3>
          </DraggableCardBody>
        ))}
      </DraggableCardContainer>
    </div>
  );
}
