const generateMatrixColumns = () => {
    const random1 = Array.from({ length: 40 }, () => Math.random());
    const random2 = Array.from({ length: 40 }, () => Math.random());
    const charRandoms = Array.from({ length: 40 }, () =>
        Array.from({ length: 25 }, () => Math.random()),
    );

    return Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: i * 2.5,
        delay: -random1[i] * 5,
        duration: 2 + random2[i] * 3,
        chars: charRandoms[i]
            .map((r) => String.fromCharCode(0x30a0 + r * 96))
            .join("\n"),
    }));
};

const matrixColumns = generateMatrixColumns();

export const MatrixRain = () => {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 font-ui-mono text-ui-micro leading-ui-grid text-theme-primary select-none pointer-events-none break-all">
            {matrixColumns.map((col) => (
                <div
                    key={col.id}
                    className="matrix-rain-column absolute top-0 w-4 text-center"
                    style={{
                        left: `${col.left}%`,
                        animationDuration: `${col.duration}s`,
                        animationDelay: `${col.delay}s`,
                    }}
                >
                    {col.chars}
                </div>
            ))}
        </div>
    );
};
