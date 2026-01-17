import { motion } from "framer-motion"

interface WordCloudProps {
  imageBase64: string
}

export function WordCloud({ imageBase64 }: WordCloudProps) {
  const src = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center gap-4"
    >
      <motion.img
        src={src}
        alt="Your word cloud"
        className="max-w-full max-h-[60vh] object-contain rounded-xl"
        initial={{ filter: "blur(20px)" }}
        animate={{ filter: "blur(0px)" }}
        transition={{ duration: 1, delay: 0.3 }}
      />
    </motion.div>
  )
}
