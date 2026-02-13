import { motion, useMotionValue, useTransform, animate, Easing } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Brain, 
  GraduationCap, 
  BookCheck, 
  BarChart3, 
  MessageSquareText,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as Easing,
  },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as Easing,
  },
};

const createOrbitAnimation = (i: number) => ({
  rotate: 360,
  transition: {
    duration: 20 + i * 5,
    repeat: Infinity,
    ease: "linear" as Easing,
  },
});

const features = [
  {
    icon: Brain,
    title: "Semantic Analysis",
    description: "Using SBERT models to understand the context and meaning of answers, ensuring grades reflect true understanding.",
  },
  {
    icon: BookCheck,
    title: "Rubric-Based Scoring",
    description: "Evaluates against specific criteria like accuracy, completeness, and clarity for standardized, fair results.",
  },
  {
    icon: MessageSquareText,
    title: "Detailed Feedback",
    description: "Generates constructive feedback automatically, helping students learn from their mistakes immediately.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track progress over time with comprehensive dashboards for both individual students and entire classes.",
  },
];

const testimonials = [
  {
    quote: "EvalAI has transformed how we grade theory exams. The semantic understanding is remarkable.",
    author: "Dr. Sarah Chen",
    role: "Professor of Computer Science",
    rating: 5,
  },
  {
    quote: "Finally, an AI that understands context! My students get meaningful feedback within seconds.",
    author: "Prof. Michael Roberts",
    role: "Department Head, Mathematics",
    rating: 5,
  },
  {
    quote: "The time savings are incredible. What took hours now takes minutes with consistent quality.",
    author: "Dr. Emily Watson",
    role: "Senior Lecturer, Physics",
    rating: 5,
  },
  {
    quote: "Students appreciate the instant, detailed feedback. It's changed how they approach learning.",
    author: "Dr. James Liu",
    role: "Associate Professor, Engineering",
    rating: 5,
  },
];

const stats = [
  { value: 50000, label: "Assessments Graded", suffix: "+" },
  { value: 98, label: "Accuracy Rate", suffix: "%" },
  { value: 85, label: "Time Saved", suffix: "%" },
  { value: 200, label: "Institutions", suffix: "+" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });

    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return (
    <span>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        
        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={createOrbitAnimation(0)}
            className="absolute top-1/4 left-1/4 w-96 h-96"
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <motion.div
              animate={floatingAnimation}
              className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-primary/30"
            />
          </motion.div>
          
          <motion.div
            animate={createOrbitAnimation(1)}
            className="absolute top-1/3 right-1/4 w-72 h-72"
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <motion.div
              animate={floatingAnimation}
              className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-accent/40"
            />
          </motion.div>
          
          <motion.div
            animate={createOrbitAnimation(2)}
            className="absolute bottom-1/4 left-1/3 w-64 h-64"
            style={{ originX: 0.5, originY: 0.5 }}
          >
            <motion.div
              animate={floatingAnimation}
              className="absolute top-0 left-1/2 w-4 h-4 rounded-full bg-primary/20"
            />
          </motion.div>
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={floatingAnimation}
            className="absolute top-20 left-[10%] text-primary/20"
          >
            <Brain className="w-12 h-12" />
          </motion.div>
          <motion.div
            animate={{
              ...floatingAnimation,
              transition: { ...floatingAnimation.transition, delay: 0.5 },
            }}
            className="absolute top-32 right-[15%] text-accent/20"
          >
            <GraduationCap className="w-10 h-10" />
          </motion.div>
          <motion.div
            animate={{
              ...floatingAnimation,
              transition: { ...floatingAnimation.transition, delay: 1 },
            }}
            className="absolute bottom-32 left-[20%] text-primary/15"
          >
            <BookCheck className="w-8 h-8" />
          </motion.div>
          <motion.div
            animate={{
              ...floatingAnimation,
              transition: { ...floatingAnimation.transition, delay: 1.5 },
            }}
            className="absolute bottom-40 right-[10%] text-accent/15"
          >
            <BarChart3 className="w-14 h-14" />
          </motion.div>
        </div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-20 md:py-32 relative"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                <motion.span
                  animate={pulseAnimation}
                  className="inline-flex items-center"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Interactive, SBERT-powered assessment
                </motion.span>
              </Badge>
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            >
              Intelligent Assessment
              <motion.span 
                className="block text-transparent bg-clip-text gradient-primary"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Beyond Keywords
              </motion.span>
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              EvalAI uses Sentence-BERT to evaluate theory answers based on meaning, 
              not just keyword matching. The home page adapts to your role, 
              surfacing the most relevant actions first.
            </motion.p>
            
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4 mb-10"
            >
              {[
                { icon: Zap, text: "Instant Grading" },
                { icon: Shield, text: "Secure & Private" },
                { icon: Clock, text: "24/7 Available" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-foreground mb-1"
                  whileHover={{ scale: 1.1 }}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </motion.div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Student Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/30"
            >
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <motion.div 
                className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <GraduationCap className="h-6 w-6 text-primary" />
              </motion.div>
              
              <Badge variant="muted" className="mb-3">Student view</Badge>
              
              <h3 className="text-2xl font-bold text-foreground mb-3">I am a Student</h3>
              
              <p className="text-muted-foreground mb-4">
                Personalized workspace with assessments and feedback tailored to you.
              </p>
              
              <p className="text-sm text-muted-foreground mb-6">
                Access upcoming assessments, see rubric-based scores for accuracy, 
                completeness, and clarity, and review detailed feedback that explains 
                how your answers were interpreted.
              </p>
              
              <div className="space-y-3">
                <Button className="w-full group/btn" variant="default" asChild>
                  <Link to="/student/dashboard">
                    Go to Assessments
                    <motion.span
                      className="inline-block ml-1"
                      whileHover={{ x: 4 }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/student/results">View Past Results</Link>
                </Button>
              </div>
              
              <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
                <motion.div 
                  className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span>Tip: After you sign in, this area updates with your active and completed assessments.</span>
              </div>
            </motion.div>

            {/* Lecturer Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-xl hover:border-accent/30"
            >
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
              
              <motion.div 
                className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <BookCheck className="h-6 w-6 text-accent" />
              </motion.div>
              
              <Badge variant="accent" className="mb-3">Lecturer view</Badge>
              
              <h3 className="text-2xl font-bold text-foreground mb-3">I am a Lecturer</h3>
              
              <p className="text-muted-foreground mb-4">
                Role-aware dashboard for question design, grading, and analytics.
              </p>
              
              <p className="text-sm text-muted-foreground mb-6">
                Create and manage question banks, configure rubrics, and monitor 
                automated grading at scale. Drill into cohort performance with 
                analytics designed for secure, evidence-based evaluation.
              </p>
              
              <div className="space-y-3">
                <Button className="w-full" variant="accent" asChild>
                  <Link to="/lecturer/dashboard">
                    Manage Assessments
                    <motion.span
                      className="inline-block ml-1"
                      whileHover={{ x: 4 }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/lecturer/analytics">View Class Analytics</Link>
                </Button>
              </div>
              
              <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
                <motion.div 
                  className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <span>Tip: Once authenticated, you'll see course-specific analytics and recent activity here.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section with Hover Effects */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trustworthy Automated Evaluation
            </h2>
            <p className="text-lg text-background/70">
              Built for accuracy, transparency, and academic integrity.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                className="group cursor-pointer"
              >
                <motion.div 
                  className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-300"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className="h-6 w-6 text-background/80 group-hover:text-accent transition-colors" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">{feature.title}</h3>
                <p className="text-sm text-background/60 group-hover:text-background/80 transition-colors">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Educators Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Trusted by leading institutions worldwide
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            <div className="overflow-hidden">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="h-5 w-5 fill-accent text-accent" />
                    </motion.div>
                  ))}
                </div>
                
                <blockquote className="text-xl md:text-2xl text-foreground mb-6 italic">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                
                <div className="flex items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{testimonials[currentTestimonial].author}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentTestimonial(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? "w-6 bg-primary" 
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center relative"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            whileInView={{
              opacity: [0, 1],
              y: [20, 0],
            }}
            transition={{ duration: 0.6 }}
          >
            Ready to Transform Assessment?
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join institutions already using EvalAI for faster, fairer, 
            and more insightful grading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" variant="hero" asChild>
                <Link to="/login">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" variant="outline" asChild>
                <Link to="/demo">Request a Demo</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center">
                <Brain className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-foreground">EvalAI</span>
            </motion.div>
            <p className="text-sm text-muted-foreground">
              © 2024 EvalAI. Intelligent Automated Theory Assessment.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Support"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
