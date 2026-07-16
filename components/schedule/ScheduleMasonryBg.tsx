"use client";

type Props = {
  images: string[];
};

function splitIntoColumns(images: string[], count: number): string[][] {
  const cols: string[][] = Array.from({ length: count }, () => []);
  images.forEach((src, i) => {
    cols[i % count].push(src);
  });
  return cols;
}

export default function ScheduleMasonryBg({ images }: Props) {
  if (!images.length) {
    return (
      <div className="schedule-bg-hero">
        <img src="/img/h1.jpg" alt="" />
      </div>
    );
  }

  const columns = splitIntoColumns(images, 3);

  return (
    <div className="schedule-masonry" aria-hidden="true">
      {columns.map((col, colIndex) => {
        // Dupliquer pour boucle seamless (translateY -50%)
        const loop = [...col, ...col];
        const direction = colIndex % 2 === 0 ? "up" : "down";
        const duration = 38 + colIndex * 10;

        return (
          <div
            key={colIndex}
            className={`schedule-masonry-col schedule-masonry-col--${direction}`}
            style={{ ["--masonry-duration" as string]: `${duration}s` }}
          >
            <div className="schedule-masonry-track">
              {loop.map((src, i) => (
                <figure
                  key={`${src}-${i}`}
                  className={`schedule-masonry-item schedule-masonry-item--${(i % 3) + 1}`}
                >
                  <img src={src} alt="" loading={i < 6 ? "eager" : "lazy"} decoding="async" />
                </figure>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
