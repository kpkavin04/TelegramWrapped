import { motion } from "framer-motion"

interface PersonaCardProps {
  persona: {
    persona_id: string
    persona_name: string
    show: string
    traits: string
    match_reason: string
    confidence: number
  }
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const imagePath = `/personas/${persona.persona_id}.png`

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 max-w-md text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
        <img
          src={imagePath}
          alt={persona.persona_name}
          className="relative w-48 h-48 md:w-64 md:h-64 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
          You're{" "}
          <span className="bg-gradient-to-r from-primary to-[#00c6ff] bg-clip-text text-transparent">
            {persona.persona_name}
          </span>
        </h2>
        <p className="text-text-secondary text-lg">from {persona.show}</p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-text-secondary leading-relaxed"
      >
        {persona.match_reason}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {persona.traits.split(",").map((trait, index) => (
          <span
            key={index}
            className="px-3 py-1 text-sm bg-surface-elevated rounded-full text-text-secondary"
          >
            {trait.trim()}
          </span>
        ))}
      </motion.div>
    </motion.div>
  )
}
