import { Card, CardContent } from '@/components/ui/card'
import { Shield, Network, Search, Zap, Twitter, Share2 } from 'lucide-react'

export function Features() {
    return (
        <section id="features" className="w-full max-w-7xl px-6 pb-32 relative z-10 bg-transparent">
            <div className="mb-14 text-center">
               <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-5 tracking-tight">Deep research for modern work</h2>
               <p className="text-zinc-400 text-lg font-light max-w-2xl mx-auto">Remove the cognitive load of organizing. Focus fully on thinking, exploring, and building connections.</p>
            </div>
            
            <div className="relative">
                <div className="relative z-10 grid grid-cols-6 gap-5">
                    {/* Card 1: 100% Automated */}
                    <Card className="relative col-span-full flex overflow-hidden lg:col-span-2 group hover:border-white/10 transition-colors duration-500">
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <CardContent className="relative m-auto size-fit pt-6">
                            <div className="relative flex h-24 w-56 items-center">
                                <svg className="text-white/5 absolute inset-0 size-full" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                <span className="mx-auto block w-fit text-5xl font-serif text-white tracking-tighter">100%</span>
                            </div>
                            <h2 className="mt-8 text-center text-xl font-serif text-white">Automated Taxonomy</h2>
                            <p className="mt-2 text-center text-sm font-light text-zinc-400">AI extracts entities and topics so you never have to tag manually again.</p>
                        </CardContent>
                    </Card>

                    {/* Card 2: Semantic Intelligence */}
                    <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2 group hover:border-white/10 transition-colors duration-500">
                        <CardContent className="pt-8 h-full flex flex-col items-center">
                            <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-white/10 before:absolute before:-inset-2 before:rounded-full before:border before:border-white/5 bg-black/20 group-hover:bg-indigo-500/5 transition-colors duration-700">
                                <svg className="m-auto h-fit w-24 text-zinc-700 group-hover:text-zinc-500 transition-colors duration-700" viewBox="0 0 212 143" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M44.0209 55.3542C43.1945 54.7639 42.6916 54.0272 42.5121 53.1442C42.3327 52.2611 42.5995 51.345 43.3125 50.3958C50.632 40.3611 59.812 32.5694 70.8525 27.0208C81.8931 21.4722 93.668 18.6979 106.177 18.6979C118.691 18.6979 130.497 21.3849 141.594 26.7587C152.691 32.1326 161.958 39.8936 169.396 50.0417C170.222 51.1042 170.489 52.0486 170.196 52.875C169.904 53.7014 169.401 54.4097 168.688 55C167.979 55.5903 167.153 55.8571 166.208 55.8004C165.264 55.7437 164.438 55.2408 163.729 54.2917C157.236 45.0833 148.885 38.0307 138.675 33.1337C128.466 28.2368 117.633 25.786 106.177 25.7812C94.7257 25.7812 83.9827 28.2321 73.948 33.1337C63.9132 38.0354 55.5903 45.0881 48.9792 54.2917C48.2709 55.3542 47.4445 55.9444 46.5 56.0625C45.5556 56.1806 44.7292 55.9444 44.0209 55.3542ZM126.188 142.656C113.91 139.587 103.875 133.476 96.0834 124.325C88.2917 115.173 84.3959 103.988 84.3959 90.7708C84.3959 84.8681 86.5209 79.9097 90.7709 75.8958C95.0209 71.8819 100.156 69.875 106.177 69.875C112.198 69.875 117.333 71.8819 121.583 75.8958C125.833 79.9097 127.958 84.8681 127.958 90.7708C127.958 94.6667 129.434 97.9439 132.385 100.602C135.337 103.261 138.819 104.588 142.833 104.583C146.847 104.583 150.271 103.256 153.104 100.602C155.938 97.9486 157.354 94.6714 157.354 90.7708C157.354 77.0764 152.337 65.566 142.302 56.2396C132.267 46.9132 120.285 42.25 106.354 42.25C92.4237 42.25 80.441 46.9132 70.4063 56.2396C60.3716 65.566 55.3542 77.0174 55.3542 90.5937C55.3542 93.4271 55.621 96.9687 56.1546 101.219C56.6882 105.469 57.9562 110.427 59.9584 116.094C60.3125 117.156 60.2842 118.101 59.8734 118.927C59.4625 119.753 58.7825 120.344 57.8334 120.698C56.8889 121.052 55.9752 121.024 55.0921 120.613C54.2091 120.202 53.5881 119.522 53.2292 118.573C51.4584 113.969 50.1905 109.395 49.4255 104.853C48.6605 100.31 48.2756 95.6158 48.2709 90.7708C48.2709 75.0694 53.9682 61.9062 65.363 51.2812C76.7577 40.6562 90.3624 35.3437 106.177 35.3437C122.115 35.3437 135.809 40.6562 147.26 51.2812C158.712 61.9062 164.438 75.0694 164.438 90.7708C164.438 96.6736 162.343 101.601 158.155 105.554C153.966 109.506 148.859 111.485 142.833 111.49C136.813 111.49 131.649 109.513 127.342 105.561C123.035 101.608 120.88 96.6783 120.875 90.7708C120.875 86.875 119.43 83.5978 116.54 80.9392C113.65 78.2805 110.196 76.9536 106.177 76.9583C102.163 76.9583 98.7089 78.2876 95.8142 80.9462C92.9195 83.6049 91.4745 86.8797 91.4792 90.7708C91.4792 102.222 94.8745 111.785 101.665 119.458C108.456 127.132 117.22 132.503 127.958 135.573C129.021 135.927 129.729 136.517 130.083 137.344C130.438 138.17 130.497 139.056 130.26 140C130.024 140.826 129.552 141.535 128.844 142.125C128.135 142.715 127.25 142.892 126.188 142.656ZM67.0417 18.3437C66.0973 18.934 65.1528 19.0828 64.2084 18.79C63.2639 18.4972 62.5556 17.8762 62.0834 16.9271C61.6112 15.9826 61.4931 15.1279 61.7292 14.3629C61.9653 13.5979 62.5556 12.9179 63.5 12.3229C70.1112 8.78125 77.0174 6.06597 84.2188 4.17708C91.4202 2.28819 98.7396 1.34375 106.177 1.34375C113.733 1.34375 121.111 2.25986 128.313 4.09208C135.514 5.92431 142.479 8.54986 149.208 11.9687C150.271 12.559 150.892 13.2674 151.071 14.0937C151.251 14.9201 151.161 15.7465 150.802 16.5729C150.448 17.3993 149.858 18.0486 149.031 18.5208C148.205 18.9931 147.201 18.934 146.021 18.3437C139.764 15.1563 133.299 12.7078 126.627 10.9983C119.954 9.28889 113.138 8.43181 106.177 8.42708C99.3299 8.42708 92.6007 9.22514 85.9896 10.8212C79.3785 12.4174 73.0625 14.9249 67.0417 18.3437ZM87.9375 140.177C80.9723 132.858 75.6314 125.392 71.915 117.78C68.1987 110.167 66.3381 101.164 66.3334 90.7708C66.3334 80.0278 70.2292 70.9658 78.0209 63.585C85.8125 56.2042 95.198 52.5161 106.177 52.5208C117.156 52.5208 126.601 56.2112 134.51 63.5921C142.42 70.9729 146.375 80.0325 146.375 90.7708C146.375 91.8333 146.052 92.6904 145.405 93.3421C144.758 93.9937 143.901 94.3172 142.833 94.3125C141.889 94.3125 141.063 93.989 140.354 93.3421C139.646 92.6951 139.292 91.8381 139.292 90.7708C139.292 81.9167 136.014 74.5099 129.46 68.5504C122.906 62.591 115.145 59.6089 106.177 59.6042C97.2049 59.6042 89.503 62.5862 83.0713 68.5504C76.6396 74.5146 73.4214 81.9214 73.4167 90.7708C73.4167 100.333 75.0695 108.451 78.375 115.123C81.6806 121.796 86.5209 128.494 92.8959 135.219C93.6042 135.927 93.9584 136.753 93.9584 137.698C93.9584 138.642 93.6042 139.469 92.8959 140.177C92.1875 140.885 91.3612 141.24 90.4167 141.24C89.4723 141.24 88.6459 140.885 87.9375 140.177ZM141.417 128.135C130.91 128.135 121.789 124.594 114.054 117.51C106.319 110.427 102.454 101.514 102.458 90.7708C102.458 89.8264 102.784 89 103.436 88.2917C104.088 87.5833 104.942 87.2292 106 87.2292C107.063 87.2292 107.92 87.5833 108.571 88.2917C109.223 89 109.546 89.8264 109.542 90.7708C109.542 99.625 112.729 106.885 119.104 112.552C125.479 118.219 132.917 121.052 141.417 121.052C142.125 121.052 143.129 120.993 144.427 120.875C145.726 120.757 147.083 120.58 148.5 120.344C149.563 120.108 150.479 120.256 151.248 120.79C152.018 121.324 152.519 122.119 152.75 123.177C152.986 124.122 152.809 124.948 152.219 125.656C151.629 126.365 150.861 126.837 149.917 127.073C147.792 127.663 145.934 127.989 144.342 128.05C142.751 128.112 141.776 128.14 141.417 128.135Z"
                                        fill="currentColor"
                                    />
                                    <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-zinc-800 group-hover:text-indigo-500/30 transition-colors duration-700">
                                        <path d="M3 72H209" />
                                    </g>
                                </svg>
                            </div>
                            <div className="relative z-10 mt-auto space-y-2 text-center">
                                <h2 className="text-xl font-serif text-white transition">Semantic Intelligence</h2>
                                <p className="text-zinc-400 font-light text-sm">Search by meaning, not text. Recall bypasses rigid keywords instantly.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Instant Processing */}
                    <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2 group hover:border-white/10 transition-colors duration-500">
                        <CardContent className="pt-8 h-full flex flex-col items-center">
                            <div className="relative mx-auto flex aspect-square size-32 items-center justify-center rounded-full border border-white/10 before:absolute before:-inset-2 before:rounded-full before:border before:border-white/5 bg-black/20 group-hover:bg-indigo-500/5 transition-colors duration-700">
                                <Zap className="size-10 text-zinc-600 group-hover:text-indigo-400 transition-colors duration-500" strokeWidth={1} />
                            </div>
                            <div className="relative z-10 mt-auto space-y-2 text-center">
                                <h2 className="text-xl font-serif text-white transition">Faster than light</h2>
                                <p className="text-zinc-400 font-light text-sm">No loading spinners. Local-first architecture guarantees instant access.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Twitter Integration */}
                    <Card className="relative col-span-full overflow-hidden lg:col-span-3 group hover:border-white/10 transition-colors duration-500">
                        <CardContent className="grid h-full pt-8 sm:grid-cols-2">
                            <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                <div className="relative flex aspect-square size-14 items-center justify-center rounded-full border border-white/10 before:absolute before:-inset-2 before:rounded-full before:border before:border-white/5 bg-black/20">
                                    <Twitter className="m-auto size-6 text-zinc-400" strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-serif text-white transition">Twitter Integration</h2>
                                    <p className="text-zinc-400 text-sm font-light">Archive long philosophical threads seamlessly without losing the original context.</p>
                                </div>
                            </div>
                            <div className="rounded-tl-2xl relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-white/5 bg-black/20 p-6 py-6 sm:ml-6 group-hover:bg-indigo-500/5 transition-colors duration-700">
                                <div className="absolute left-3 top-3 flex gap-1">
                                    <span className="block size-2 rounded-full border border-white/10 bg-white/5"></span>
                                    <span className="block size-2 rounded-full border border-white/10 bg-white/5"></span>
                                    <span className="block size-2 rounded-full border border-white/10 bg-white/5"></span>
                                </div>
                                {/* Simple Mock UI for Tweet */}
                                <div className="mt-6 flex flex-col gap-4">
                                     <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                                        <div className="space-y-2 flex-1 mt-1">
                                            <div className="h-2 w-28 bg-white/20 rounded" />
                                            <div className="h-1.5 w-full bg-white/10 rounded" />
                                            <div className="h-1.5 w-5/6 bg-white/10 rounded" />
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 5: Knowledge Graph */}
                    <Card className="relative col-span-full overflow-hidden lg:col-span-3 group hover:border-white/10 transition-colors duration-500">
                        <CardContent className="grid h-full pt-8 sm:grid-cols-2">
                            <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                <div className="relative flex aspect-square size-14 items-center justify-center rounded-full border border-white/10 before:absolute before:-inset-2 before:rounded-full before:border before:border-white/5 bg-black/20">
                                    <Network className="m-auto size-6 text-zinc-400" strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-serif text-white transition">Knowledge Graph</h2>
                                    <p className="text-zinc-400 text-sm font-light">Visualize hidden connections between your notes natively in a graphical map.</p>
                                </div>
                            </div>
                            <div className="before:bg-white/5 relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                                <div className="relative flex w-full h-full flex-col justify-center space-y-6 py-6 px-10">
                                     <div className="flex relative justify-between items-center w-full">
                                         <div className="size-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center z-10">
                                            <span className="text-xs font-serif text-indigo-200">Idea</span>
                                         </div>
                                         <div className="h-px bg-white/10 w-full absolute top-1/2 left-0 z-0" />
                                         <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center z-10 backdrop-blur-md">
                                             <Network className="size-6 text-zinc-400" />
                                         </div>
                                         <div className="size-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center z-10">
                                            <span className="text-xs font-serif text-zinc-400">Note</span>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
