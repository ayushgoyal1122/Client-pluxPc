import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[100px] sm:text-[120px] font-extrabold text-gray-100 leading-none select-none tracking-tight">
          404
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="btn-volt">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
