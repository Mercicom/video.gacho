import Link from "next/link";
import { ArrowRight, Video, Sparkles, TrendingUp, Target, BarChart3, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Creative Automation
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Automate Creative Production
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A suite of AI-powered tools designed to streamline creative production,
            strategy analysis, and performance marketing workflows.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/video-analyzer"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Try Video Analyzer
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Featured Tool: Video Analyzer */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Info */}
            <div className="p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold mb-4 w-fit">
                <Zap className="w-3 h-3" />
                NOW AVAILABLE
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Video Analyzer
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Analyze videos in bulk to extract actionable marketing insights.
                Perfect for content creators, marketers, and creative teams.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Hook Detection</h3>
                    <p className="text-sm text-gray-600">
                      Extract visual, text, and voice hooks from the first 3 seconds
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
                    <Video className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Complete Transcription</h3>
                    <p className="text-sm text-gray-600">
                      Full video scripts with timestamps and pain point analysis
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg mt-0.5">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Batch Processing</h3>
                    <p className="text-sm text-gray-600">
                      Analyze up to 500 videos at once with automatic rate limiting
                    </p>
                  </div>
                </div>
              </div>
              
              <Link
                href="/video-analyzer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full md:w-auto"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Right Side - Visual */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-12 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-white rounded-xl shadow-2xl p-8">
                  <Video className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    <div className="flex gap-2 pt-4">
                      <div className="h-8 bg-blue-100 rounded flex-1"></div>
                      <div className="h-8 bg-purple-100 rounded flex-1"></div>
                      <div className="h-8 bg-green-100 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            More Tools Coming Soon
          </h2>
          <p className="text-lg text-gray-600">
            We&apos;re building a comprehensive suite of AI-powered tools for creative strategy,
            content analysis, and performance marketing optimization.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Creative Strategy</h3>
            <p className="text-sm text-gray-500">
              AI-driven insights for campaign planning and creative direction
            </p>
            <span className="inline-block mt-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Performance Analysis</h3>
            <p className="text-sm text-gray-500">
              Deep analytics for ad performance and audience engagement
            </p>
            <span className="inline-block mt-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Content Automation</h3>
            <p className="text-sm text-gray-500">
              Automated workflows for content creation and optimization
            </p>
            <span className="inline-block mt-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
