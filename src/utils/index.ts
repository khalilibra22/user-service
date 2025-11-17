export const getS3Url = (key: string): string => {
  return `${process.env.S3_READ_URL}/${key}`;
};

export const getDurationInMonths = (
  duration?: number,
  unit?: string
): number => {
  //check if the parameters are not null or undefined
  const adjustedDuration = duration ?? 0;
  const adjustedUnit = unit || "months";
  if (adjustedUnit === "years") {
    return adjustedDuration * 12;
  }
  return adjustedDuration;
};
