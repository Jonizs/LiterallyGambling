/* A batch that pays out one at a time: a job of ten silver bars hands back a
   bar every burn, not ten at the end. Shared by the ovens and the crucibles. */
(function (global) {
  "use strict";

  // A job is { key, qty, taken, startedAt, unitMs }: qty is how many the batch
  // is still set to make, taken is how many have been carried off already.
  function finished(job, now) {
    var made = Math.floor((now - job.startedAt) / job.unitMs);
    return Math.max(0, Math.min(job.qty, made));
  }

  function claimable(job, now) {
    return finished(job, now) - job.taken;
  }

  // The one on the fire right now, 0-based; qty once the batch is spent.
  function current(job, now) { return finished(job, now); }

  function complete(job, now) { return finished(job, now) >= job.qty; }

  function endsAt(job) { return job.startedAt + job.unitMs * job.qty; }

  // Time to the next one, or to the end of the batch when it is all made.
  function nextIn(job, now) {
    if (complete(job, now)) return 0;
    return job.startedAt + job.unitMs * (finished(job, now) + 1) - now;
  }

  function claim(job, now) {
    var count = claimable(job, now);
    job.taken += count;
    return count;
  }

  // Drop everything still queued behind the one on the fire. Returns how many
  // were cancelled, so the caller can hand the inputs back.
  function stop(job, now) {
    var keep = Math.min(job.qty, current(job, now) + 1);
    var cancelled = job.qty - keep;
    job.qty = keep;
    return cancelled;
  }

  global.Batch = {
    finished: finished,
    claimable: claimable,
    complete: complete,
    endsAt: endsAt,
    nextIn: nextIn,
    claim: claim,
    stop: stop
  };
})(window);
