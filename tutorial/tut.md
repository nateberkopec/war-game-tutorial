# Let's Make a Game

Hey guys. Let's make a game with... I don't know what to really call this stuff. Agentic programming? Riding the LLM shoggoth? Who knows.

I'm setting a hard limit of an hour on this. It's currently 7:30pm and I'm gonna stop at 8:30. So far, all I've done is type some markdown into this editor. For context, 100% of the text in this tutorial will be typed out (like a fucking caveman) by me.

With agentic programming, really the first step is research and generating a kind of spec document.

Here's what I know are our requirements:

1. We are going to implement the card game of War
2. We are going to distribute for Itch.io
3. It will be a browser game
4. It will be a 2-player game (we're gonna implement this as hot-seat local for now).

In general, my workflow of agent programming is sort of narrow-wide-narrow.

Phase 1 is building the initial spec and context. Dumping everything you can out of your head, getting all the research you need into text files, setting the mise en place. This should _not_ devolve into waterfall development. You're not trying to _do development work_ at this stage, you're trying to _get all the ideas which already exist into a format that the LLM can read them_ (so, not in your head or off in the internet somewhere). This part is *narrow*, by which I mean you will be working with 1 agent window open and just talking back and forth.

Phase 2 is implementation. This phase is *wide*. You'll have 2-4 agent windows open, all implementing different parts of your specification. You'll generally just kind of watch them do their work, hopefully do only a minimal amount of steering (either by enqueueing messasges to them or stopping them completely to say something)

Phase 3 is review. This is where it gets narrow again. You, the human main thread, are blocked again by reviewing the results of phase 2. This phase is narrow again and we're blocked on you.

Enough prelude. Let's get to it.

The first big decision is **what model to use**. There are only two worth your time at the moment:

1. **Claude Opus 4.5**. Incredibly good "tool use" (meaning, how/when it reads/writes to files, runs bash, etc), and generally just more pleasant to talk to.
1. **ChatGPT Codex 5.2**. Seems to be "smarter" in certain ways than Claude, but the tool usage is worse and it's significantly slower. Most people set the "reasoning level" (a.k.a, how many tokens you burn) to high (I do).

Both of these are best available models and they both have fixed-price, use-up-to-a-limit plans WHICH YOU ABSOLUTELY SHOULD USE. While you're still in the getting your feet wet stage it's fine to pay as you go, but this quickly gets out of hand. The subscriptions cost $20-200 per month but you can easily get 5-10x the value of that out of it (in terms of token cost). I don't know why the hell anybody bothers to pay per token. Just getting the fucking plan.

One major disadvantage of Claude right now is that they are trying to block 3rd party usage of their Max subscriptions. They want to force you to use the official Claude Code harness/client application. I'm not a massive fan of it.

My preferred "harness" or client is Opencode. I like Opencode for a number of reasons:

1. It's very pretty
2. You can share entire sessions, including tool calls and files modified, which is extremely useful for sharing what you did with others, like this tutorial!
3. You can use almost any model from almost any provider

So I'll be using opencode for this tutorial.

The first thing you have to understand with agentic programming is that nobody gives a fuck about security. The harnesses by default will ask you to _approve every single tool call_ which is basically completely onerous and, I would say, anyone manually approving tool calls during a session is not doing agentic programming, they are doing agentic babysitting.

So you need to [turn off all permission approvals and allow opencode to access all directories on your computer](https://github.com/nateberkopec/dotfiles/blob/d70ce04472970996d24aba9df8b102b52343a4ea/files/home/.config/fish/config.fish#L24).

Honestly [LLM agent security is an entire thing](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) we don't have time to cover here. The endgame will be something like containers, but no one has made it actually not feel like sticking nails in your eyeballs yet.

Fuck it's been 15 minutes and I haven't even opened an opencode window yet.

PROMPT:
```
1. We are going to implement the card game of War
2. We are going to distribute for Itch.io
3. It will be a browser game
4. It will be a 2-player game (we're gonna implement this as hot-seat local for now).  Interview about this game and the approach, and write a SPEC.md.
```

I answered a few questions from Claude here. I chose Three.js for the framework just because I've seen it alot on X. I've never used it before.

The initial spec Claude generates is archived here in [SPEC.md](./SPEC.md)

At this stage normally I'm getting in there and modifying the SPEC considerably, but this shit is so fucking simple I don't have to do that. So we're pretty clear on what we're building and at this point now we have to decide how it's going to be implemented. I think Claude could honestly one-shot this but I want to show some more complicated workflows so I'm going to expand the scope considerably so we can get 3-4 agents going concurrently on multiple workstreams.


PROMPT:
```
Research itch.io intergration. Do some internet research about how to publish to itch.io, anything we should keep in mind while implementing the game. What APIs exist, what should we consider knowing that we're gonna publish to itch.
```

Key word there was "internet research" which is gonna trigger some `web search` and `web fetch` tool calls. It might have figured that out even if I hadn't said anything but its helpful to think about how to prompt to trigger specific tool calls.

It expanded the spec a bit here.

PROMPT:

```
I'd like to build more features into the "game engine" here. What are some things we can consider? The kinds of things we can work on separate from the UI. Let's say, configurable rules like 3-card war you laid out before? What else can we do?
```

Answered more questions and said "gimme ALL DA SLOP PLS" basically.

With all agentic programming, testing is really important. You can never trust anything the LLM says works without seeing passing tests. So our next question is about that:

PROMPT:
```
Let's describe the testing setup we're gonna use here. We will of course need full up browser tests... we'll need somethign compatible with testing a Three.js game though? What can we use?
```

I answer that we want unit tests , integration tests, and the full browser E2E tests will use screenshots comparing to golden images.

Alright we're halfway through here and still haven't implemented shit yet. Time to move to phase 2.

We need to split this into parallelizable workstreams.

PROMPT:

```
Create a step by step implementation plan. Split the work into phases, and workstreams that can be completed in parallel (e.g. UI vs engine work, split features up into different workstreams, etc). Our goal is to parallelize this work out across 4 agents. Write to PLAN.md.
```

It went ahead and did that. Neato.

I have some fancy scripts I've used for setting up git worktrees here and then launching opencode inside of tmux etc etc but I'm gonna be lazy as fuck and just have the agent do it for me here.

PROMPT:
```
Let's think, how are they gonna coordinate? I'd like to use git, github, git worktrees, and 4 opencode windows. Write out our coordination strategy at the top of PLAN.md.
```

And then one last:
PROMPT:
```
Ultrathink through the entire PLAN.md and SPEC.md so far. Do you see any landmines, inconsistenicies, logic errors or anything else we need to address before implementation
```

Ultrathink here causes Claude to use more tokens.

Ok 15 minutes left fuck, time to motor. Let's launch this fucker and go.

At this point I'm gonna close that main agent window we've been using (you can pick up and resume this later).
